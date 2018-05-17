//
//  Aggregate.h
//  Gelbox
//
//  Created by Chaim Gingold on 5/2/18.
//

#pragma once

#include <sstream>

/*
	A set of weights that represented weighted distribution of multimers
		   - empty means default (monomer) -- should never happen!!!
		   - dimer is {0,1} (0 for size 1, 1 for size 2)
		   - 50/50 dimers and trimers is {0,1,1}
		   - can no non-uniform distributions, e.g.: {.5,1,2}
		   etc...

	We should probably make set/get work with 1 indexing, not 0 indexing...
	
*/

class Aggregate : public std::vector<float>
{
public:

	Aggregate( std::vector<float>& v )
	{
		clear();
		resize(v.size(),0.f);
		
		for( int i=0; i<v.size(); ++i )
		{
			(*this)[i] = v[i];
		}
	}
	
	Aggregate()
	{
		set(0,1.f); // start off as a monomer: one element set to 1
	}
	
	void zeroAll()
	{
		for( size_t i=0; i<size(); ++i )
		{
			(*this)[i] = 0.f;
		}
	}
	
	void set( size_t a, float w )
	{
		if ( size() <= a ) {
			resize(a+1,0.f);
		}
		(*this)[a] = w;
	}
	
	float get( size_t a ) const
	{
		if ( a >= size() ) return 0.f;
		else return (*this)[a];
	}
	
	const std::vector<float>& get() const {
		return *this;
	}

	float calcSum() const {
		float sum = 0.f;
		for( auto w : (*this) ) sum += w;
		return sum; 
	}

/*
	// Doesn't make much sense--0th element will always be zero!
	float calcWeightedSum() const {
		float sum = 0.f;
		for( int i=0; i<size(); ++i ) sum += mAggregate[i] * (float)i;
		return sum; 
	}
*/	
	int calcRange( int& lo, int& hi ) const
	{
		lo = hi = -1;
		
		int numNonZeroMultimers = 0;
		
		for( int m=0; m<size(); ++m )
		{
			if ( (*this)[m] > 0.f )
			{
				numNonZeroMultimers++;
				if ( lo == -1 ) lo = m;
				hi = m;					
			}
		}
		
		return numNonZeroMultimers;			
	} 
	
	std::string toString() const
	{
		std::stringstream ss;
		
		ss << std::fixed << std::setprecision(1);
		ss << "[ ";
		
		for( size_t i=0; i<size(); ++i ) {
			if (i) ss << ", ";
			ss << (*this)[i];
		}
		
		ss << "]";
		return ss.str();		
	} 
	
};
